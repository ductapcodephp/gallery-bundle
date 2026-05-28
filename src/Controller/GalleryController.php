<?php
namespace AmzsCMS\GalleryBundle\Controller;

use AmzsCMS\GalleryBundle\Constant\GalleryRoute;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\GalleryPictures;
use AmzsCMS\GalleryBundle\Form\GalleryPicturesType;
use AmzsCMS\GalleryBundle\Form\ManageGalleryFormType;
use AmzsCMS\GalleryBundle\Repository\GalleryRepository;
use AmzsCMS\GalleryBundle\Services\GalleryPictureService;
use AmzsCMS\GalleryBundle\Services\GalleryService;
use AmzsCMS\GalleryBundle\Services\PictureService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class GalleryController extends AbstractController
{

    public function index(
        Request $request,
        GalleryRepository $galleryRepository,
        EntityManagerInterface $em
    ): Response {
        $folderId = $request->query->getInt('folderId', 0);

        $currentFolder = ($folderId > 0) ? $galleryRepository->find($folderId) : null;

        $galleryPicturesRepo = $em->getRepository(GalleryPictures::class);

        if ($currentFolder === null) {
            $folders = $galleryRepository->getAllGalleriesRoot();

            $pictures = $galleryPicturesRepo->findPicturesInRoot();
        } else {
            $folders = $currentFolder->getChildren();
            $pictures = $galleryPicturesRepo->findPicturesInFolder($currentFolder);
        }

        $breadcrumbs = [['id' => 0, 'name' => 'Thư mục gốc']];
        if ($currentFolder !== null) {
            $node = $currentFolder;
            $pathNodes = [];
            while ($node !== null) {
                array_unshift($pathNodes, ['id' => $node->getId(), 'name' => $node->getName()]);
                $node = $node->getParent();
            }
            $breadcrumbs = array_merge($breadcrumbs, $pathNodes);
        }

        return $this->render('@AmzsGallery/gallery/index.html.twig', [
            'folders'         => $folders,
            'pictures'        => $pictures,
            'breadcrumbs'     => $breadcrumbs,
            'currentFolderId' => $folderId
        ]);
    }


    public function delete(int $id, GalleryService $galleryService, EntityManagerInterface $manager): JsonResponse
    {
        $gallery = $galleryService->find($id);
        $manager->remove($gallery);
        $manager->flush();

        return new JsonResponse(['message' => 'Folder and all pictures deleted successfully']);
    }

    public function add(EntityManagerInterface $manager, Request $request, int $id = 0): Response
    {
        $gallery = new Gallery();

        if ($id > 0) {
            $parent = $manager->getRepository(Gallery::class)->find($id);
            if ($parent) {
                $gallery->setParent($parent);
            }
        }

        $form = $this->createForm(ManageGalleryFormType::class, $gallery, [
            'action' => $this->generateUrl(GalleryRoute::ADD, ['id' => $id]),
        ]);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $manager->persist($gallery);
            $manager->flush();

            return new JsonResponse(['message' => 'Gallery added successfully'], Response::HTTP_CREATED);
        }

        $form = $form->createView();
        $title = "Add gallery";

        return $this->render('@AmzsGallery/gallery/add_or_edit.html.twig', compact('title', 'gallery', 'form'));
    }

    public function edit(int $id, Request $request, GalleryService $galleryService, EntityManagerInterface $manager): Response
    {
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


    public function editPicture(
        Request $request,
        EntityManagerInterface $em,
        $galleryPictureId
    ): Response {

        $galleryPicture = $em->getRepository(GalleryPictures::class)->find($galleryPictureId);

        if (!$galleryPicture)
        {
            throw new NotFoundHttpException('Không tìm thấy ảnh này trong thư viện!');}

        $form = $this->createForm(GalleryPicturesType::class, $galleryPicture, [
            'action' => $this->generateUrl('amzs_admin_gallery_edit_picture_route', ['galleryPictureId' => $galleryPictureId]),
            'method' => 'POST',
        ]);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $em->flush();
            return new JsonResponse(['status' => 'success', 'message' => 'Cập nhật thành công!'], 200);
        }
        return $this->render('@AmzsGallery/gallery/edit_picture.html.twig', [
            'form' => $form->createView(),
            'galleryPicture' => $galleryPicture
        ]);
    }



    public function deletePicture(
        int $galleryPictureId,
        EntityManagerInterface $manager
    ): Response {
        $galleryPicture = $manager->getRepository(GalleryPictures::class)->find($galleryPictureId);
        if (empty($galleryPicture)) {
            return new JsonResponse(['error' => 'Không tìm thấy ảnh này trong hệ thống!'], 404);
        }

        $manager->remove($galleryPicture);
        $manager->flush();

        return new JsonResponse([
            'message' => 'Picture deleted successfully',
        ]);
    }

    public function modal(
        Request $request,
        GalleryRepository $galleryRepository,
        EntityManagerInterface $em
    ): Response {
        $folderId      = $request->query->getInt('folderId', 0);
        $currentFolder = ($folderId > 0) ? $galleryRepository->find($folderId) : null;
        $picturesRepo  = $em->getRepository(GalleryPictures::class);

        if ($currentFolder === null) {
            $folders  = $galleryRepository->getAllGalleriesRoot();
            $pictures = $picturesRepo->findPicturesInRoot();
        } else {
            $folders  = $currentFolder->getChildren();
            $pictures = $picturesRepo->findPicturesInFolder($currentFolder);
        }

        $breadcrumbs = [['id' => 0, 'name' => 'Thư mục gốc']];
        if ($currentFolder !== null) {
            $node = $currentFolder;
            $pathNodes = [];
            while ($node !== null) {
                array_unshift($pathNodes, ['id' => $node->getId(), 'name' => $node->getName()]);
                $node = $node->getParent();
            }
            $breadcrumbs = array_merge($breadcrumbs, $pathNodes);
        }

        $data = [
            'folders'         => $folders,
            'pictures'        => $pictures,
            'breadcrumbs'     => $breadcrumbs,
            'currentFolderId' => $folderId,
            'isModal'         => true,
        ];

        if ($request->headers->get('X-Requested-With') === 'XMLHttpRequest') {
            return $this->render('@AmzsGallery/gallery/_content_modal.html.twig', $data);
        }

        // Request thường → full modal page
        return $this->render('@AmzsGallery/gallery/modal.html.twig', $data);
    }

}