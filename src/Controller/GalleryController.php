<?php
namespace AmzsCMS\GalleryBundle\Controller;

use AmzsCMS\GalleryBundle\Constant\GalleryRoute;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\Picture;
use AmzsCMS\GalleryBundle\Form\ManageGalleryFormType;
use AmzsCMS\GalleryBundle\Repository\GalleryRepository;
use AmzsCMS\GalleryBundle\Services\GalleryPictureService;
use AmzsCMS\GalleryBundle\Services\GalleryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Vich\UploaderBundle\Templating\Helper\UploaderHelper;

class GalleryController extends AbstractController
{

    public function index(Request $request, GalleryRepository $galleryRepository, EntityManagerInterface $em): Response
    {
        // Lấy folderId từ URL (?folderId=101), nếu không có thì mặc định là 0 (Gốc)
        $folderId = $request->query->getInt('folderId', 0);

        $currentFolder = ($folderId > 0) ? $galleryRepository->find($folderId) : null;

        // Lấy danh sách Thư mục & Ảnh dựa theo vị trí hiện tại
        if ($currentFolder === null) {
            $folders = $galleryRepository->getAllGalleriesRoot();
            $pictures = []; // Thư mục gốc không chứa ảnh
        } else {
            $folders = $currentFolder->getChildren();
            $pictures = $em->getRepository(Picture::class)->findBy([
                'gallery' => $currentFolder
            ]);
        }

        // Dựng lại chuỗi cấu trúc Breadcrumbs cây thư mục
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

        // Trả về duy nhất 1 file Twig, Turbo sẽ lo việc trích xuất và đè dữ liệu
        return $this->render('@AmzsGallery/gallery/index.html.twig', [
            'folders'         => $folders,
            'pictures'        => $pictures,
            'breadcrumbs'     => $breadcrumbs,
            'currentFolderId' => $folderId
        ]);
    }



    public function delete(Request $request, int $id, GalleryService $service, EntityManagerInterface $manager): JsonResponse
    {
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

    public function add(EntityManagerInterface $manager, Request $request): Response
    {
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



    public function addPicture(int $id, GalleryService $galleryService): Response
    {
        $gallery = $galleryService->find($id);
        $title = 'Add picture';
        $galleryPicture = null;
        return $this->render('@AmzsGallery/gallery/gallery_pictures.html.twig', compact('gallery','title', 'galleryPicture'));
    }

    public function editPicture(
        int $id, int $galleryPictureId,
        GalleryService $galleryService, GalleryPictureService $galleryPictureService): Response
    {
        $gallery = $galleryService->find($id);
        $title = 'Edit picture';
        $galleryPicture = $galleryPictureService->find($galleryPictureId);
        return $this->render('@AmzsGallery/gallery/gallery_pictures.html.twig', compact('gallery', 'galleryPicture', 'title'));
    }


    public function deletePicture(
        int $id, int $galleryPictureId,
        GalleryService $galleryService,
        Request $request,
        EntityManagerInterface $manager,
        GalleryPictureService $galleryPictureService): Response
    {
        $entity = $galleryService->find($id);
        $picture = $galleryPictureService->find($galleryPictureId);
        $csrfToken = $request->query->get('_csrf_token');
        if(!$this->isCsrfTokenValid('delete-picture', $csrfToken) || empty($entity))
            throw new AccessDeniedHttpException();

        $picture->setArchived(true);
        $manager->flush();
        return new JsonResponse([
            'message' => 'Picture deleted successfully',
        ]);
    }


}