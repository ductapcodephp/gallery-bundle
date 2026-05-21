<?php
namespace AmzsCMS\GalleryBundle\Controller;

use AmzsCMS\GalleryBundle\Constant\GalleryRoute;
use AmzsCMS\GalleryBundle\DataTable\GalleryChildDataTable;
use AmzsCMS\GalleryBundle\DataTable\GalleryDataTable;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Form\ManageGalleryFormType;
use AmzsCMS\GalleryBundle\Services\GalleryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;

class GalleryController extends AbstractController
{

    public function index(): Response
    {
        return $this->render('@AmzsGallery/gallery/index.html.twig');
    }

    public function data(
        Request $request,
        GalleryDataTable $galleryDataTable
    ): Response {
        return $this->json($galleryDataTable->getData($request));
    }

    public function delete(
        Request $request,
        int $id,
        GalleryService $service,
        EntityManagerInterface $manager
    ): JsonResponse {
        $entity = $service->find($id);
        $csrfToken = $request->query->get('_csrf_token');
        if (!$this->isCsrfTokenValid('delete-gallery', $csrfToken)) {
            throw new AccessDeniedHttpException();
        }

        $entity->setArchived(true);
        $manager->flush();
        return new JsonResponse([
            'message' => 'Gallery deleted successfully',
        ]);
    }

    public function add(
        EntityManagerInterface $manager,
        Request $request
    ): Response {
        $gallery = new Gallery();
        $form = $this->createForm(ManageGalleryFormType::class, $gallery, [
            'action' => $this->generateUrl(GalleryRoute::ADD),
        ]);
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $manager->persist($gallery);
            $manager->flush();

            return new JsonResponse(['message' => 'Gallery add successfully'],
                Response::HTTP_CREATED);
        }
        $form = $form->createView();
        $title = "Add gallery";
        return $this->render('@AmzsGallery/gallery/add_or_edit.html.twig',
            compact('title', 'gallery', 'form'));
    }

    public function edit(
        int $id,
        Request $request,
        GalleryService $galleryService,
        EntityManagerInterface $manager
    ): Response {
        $title = "Edit gallery";
        $gallery = $galleryService->find($id);

        $form = $this->createForm(ManageGalleryFormType::class, $gallery, [
            'action' => $this->generateUrl(GalleryRoute::EDIT,
                ['id' => $gallery->getId()]),
        ]);
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $manager->persist($gallery);
            $manager->flush();

            return new JsonResponse(['message' => 'Gallery edited successfully'],
                Response::HTTP_CREATED);
        }
        $form = $form->createView();

        return $this->render('@AmzsGallery/gallery/add_or_edit.html.twig',
            compact('title', 'gallery', 'form'));
    }
    public function children(
        int $parentId,
        EntityManagerInterface $em
    ): Response {
        $gallery = $em->getRepository(Gallery::class)->find($parentId);
        return $this->render(
            '@AmzsGallery/gallery/index_child.html.twig',['gallery' => $gallery]);
    }
    public function dataChild(
        int $parentId,
        Request $request,
        GalleryChildDataTable $galleryDataTable
    ): Response {

        $request->query->set('parentId', $parentId);
        return $this->json(
            $galleryDataTable->getData($request)
        );
    }
    public function addChild(
        int $parentId,
        Request $request,
        GalleryService $galleryService,
        EntityManagerInterface $manager
    ): Response {

        $parent = $galleryService->find($parentId);

        if (!$parent) {
            throw $this->createNotFoundException();
        }

        $gallery = new Gallery();

        // set cha
        $gallery->setParent($parent);

        $form = $this->createForm(
            ManageGalleryFormType::class,
            $gallery,
            [
                'action' => $this->generateUrl(
                    'amzs_admin_gallery_add_child_route',
                    [
                        'parentId' => $parentId
                    ]
                ),
            ]
        );

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {

            $manager->persist($gallery);
            $manager->flush();

            return new JsonResponse([
                'message' => 'Gallery child added successfully'
            ], Response::HTTP_CREATED);
        }

        return $this->render(
            '@AmzsGallery/gallery/add_or_edit.html.twig',
            [
                'title' => 'Add child gallery',
                'gallery' => $gallery,
                'form' => $form->createView(),
            ]
        );
    }

}